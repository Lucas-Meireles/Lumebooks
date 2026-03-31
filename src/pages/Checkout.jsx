import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost } from '../services/api'
import './Checkout.css'

const API_STORAGE_URL = 'http://127.0.0.1:8000/storage'

export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ebook, setEbook] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isPaying, setIsPaying] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalAmount, setFinalAmount] = useState(0)

  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  })

  useEffect(() => {
    async function fetchEbook() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await apiGet(`/publications/${id}`)
        setEbook(data)
      } catch (error) {
        setErrorMessage(error.message || 'Não foi possível carregar o checkout.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEbook()
  }, [id])

  useEffect(() => {
    async function fetchFirstPurchaseCoupon() {
      try {
        const data = await apiGet('/my-first-purchase-coupon')

        if (data?.show_banner && data?.coupon?.code) {
          setCouponCode(data.coupon.code)
        }
      } catch {
        // segue o baile sem cupom automático
      }
    }

    fetchFirstPurchaseCoupon()
  }, [])

  useEffect(() => {
    if (!ebook) return
    setFinalAmount(Number(ebook.price || 0))
  }, [ebook])

  const formattedCardNumber = useMemo(() => {
    const digits = cardData.number.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }, [cardData.number])

  const formattedExpiry = useMemo(() => {
    const digits = cardData.expiry.replace(/\D/g, '').slice(0, 4)

    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }, [cardData.expiry])

  const cardBrand = useMemo(() => {
    const digits = cardData.number.replace(/\D/g, '')

    if (/^4/.test(digits)) return 'Visa'
    if (/^5[1-5]/.test(digits)) return 'Mastercard'
    if (/^3[47]/.test(digits)) return 'Amex'
    if (/^6/.test(digits)) return 'Elo'
    return 'Cartão'
  }, [cardData.number])

  const subtotal = useMemo(() => Number(ebook?.price || 0), [ebook])

  function getCoverUrl(coverPath) {
    if (!coverPath) return null
    if (coverPath.startsWith('http')) return coverPath
    return `${API_STORAGE_URL}/${coverPath}`
  }

  function handleCardChange(event) {
    const { name, value } = event.target
    let nextValue = value

    if (name === 'number') {
      nextValue = value.replace(/\D/g, '').slice(0, 16)
    }

    if (name === 'name') {
      nextValue = value.replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    }

    if (name === 'expiry') {
      nextValue = value.replace(/\D/g, '').slice(0, 4)
    }

    if (name === 'cvv') {
      nextValue = value.replace(/\D/g, '').slice(0, 3)
    }

    setCardData((prev) => ({
      ...prev,
      [name]: nextValue,
    }))
  }

  function validateCardFields() {
    const digitsNumber = cardData.number.replace(/\D/g, '')
    const digitsExpiry = cardData.expiry.replace(/\D/g, '')
    const digitsCvv = cardData.cvv.replace(/\D/g, '')

    if (!cardData.name.trim()) {
      throw new Error('Preencha o nome no cartão.')
    }

    if (digitsNumber.length < 16) {
      throw new Error('Número do cartão inválido.')
    }

    if (digitsExpiry.length < 4) {
      throw new Error('Validade do cartão inválida.')
    }

    if (digitsCvv.length < 3) {
      throw new Error('CVV inválido.')
    }

    const month = Number(digitsExpiry.slice(0, 2))
    const year = Number(`20${digitsExpiry.slice(2, 4)}`)

    if (month < 1 || month > 12) {
      throw new Error('Mês de validade inválido.')
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new Error('Cartão vencido.')
    }
  }

  async function handleApplyCoupon() {
    if (!ebook) return

    setIsApplyingCoupon(true)
    setCouponError('')
    setCouponMessage('')

    try {
      if (!couponCode.trim()) {
        throw new Error('Digite um cupom para aplicar.')
      }

      const data = await apiPost('/apply-coupon', {
        code: couponCode.trim(),
        amount: subtotal,
        category_id: ebook.category_id || null,
        publication_id: ebook.id,
      })

      setAppliedCoupon(data.coupon || null)
      setDiscountAmount(Number(data.discount_amount || 0))
      setFinalAmount(Number(data.final_amount || subtotal))
      setCouponMessage(data.message || 'Cupom aplicado com sucesso.')
      setCouponError('')
    } catch (error) {
      setAppliedCoupon(null)
      setDiscountAmount(0)
      setFinalAmount(subtotal)
      setCouponMessage('')
      setCouponError(error.message || 'Erro ao aplicar cupom.')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  function handleRemoveCoupon() {
    setCouponCode('')
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setFinalAmount(subtotal)
    setCouponMessage('')
    setCouponError('')
  }

  async function handleFinishPayment() {
    if (!ebook) return

    setIsPaying(true)

    try {
      if (paymentMethod === 'card') {
        validateCardFields()
      }

      const data = await apiPost('/purchases', {
        publication_id: ebook.id,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code || null,
      })

      alert(data.message || 'Compra realizada com sucesso.')
      navigate('/my-library')
    } catch (error) {
      alert(error.message || 'Erro ao finalizar pagamento.')
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return (
      <main className="checkout-page">
        <section className="checkout-feedback">Carregando checkout...</section>
      </main>
    )
  }

  if (errorMessage || !ebook) {
    return (
      <main className="checkout-page">
        <section className="checkout-feedback checkout-feedback-error">
          <strong>{errorMessage || 'Checkout indisponível.'}</strong>

          <div className="checkout-feedback-actions">
            <button
              className="checkout-secondary-button"
              type="button"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </button>
          </div>
        </section>
      </main>
    )
  }

  const coverUrl = getCoverUrl(ebook.cover_path)

  return (
    <main className="checkout-page">
      <div className="checkout-glow checkout-glow-left" />
      <div className="checkout-glow checkout-glow-right" />

      <section className="checkout-shell">
        <aside className="checkout-summary">
          <button className="checkout-back" type="button" onClick={() => navigate(-1)}>
            ← Voltar
          </button>

          <span className="checkout-badge">Checkout seguro</span>

          <div
            className={`checkout-cover ${coverUrl ? 'has-image' : ''}`}
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          >
            <span className="checkout-cover-label">LumeBooks</span>
            <h1>{ebook.title}</h1>
          </div>

          <div className="checkout-summary-card">
            <span className="checkout-summary-label">Produto</span>
            <strong>{ebook.title}</strong>
          </div>

          <div className="checkout-summary-card">
            <span className="checkout-summary-label">Categoria</span>
            <strong>{ebook.category?.name || 'Categoria'}</strong>
          </div>

          <div className="checkout-summary-card">
            <span className="checkout-summary-label">Entregue em</span>
            <strong>Biblioteca digital</strong>
          </div>

          <div className="checkout-summary-card">
            <span className="checkout-summary-label">Subtotal</span>
            <strong>
              {subtotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>

          <div className="checkout-summary-card">
            <span className="checkout-summary-label">Desconto</span>
            <strong>
              {discountAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>

          <div className="checkout-summary-total">
            <span>Total</span>
            <strong>
              {Number(finalAmount || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
        </aside>

        <section className="checkout-panel">
          <div className="checkout-header">
            <span className="checkout-overline">Pagamento</span>
            <h2>Escolha como deseja pagar</h2>
            <p>Finalize sua compra com uma experiência elegante e objetiva.</p>
          </div>

          <div className="checkout-coupon-box">
            <div className="checkout-coupon-header">
              <span className="checkout-coupon-badge">Cupom</span>
              {appliedCoupon && (
                <span className="checkout-coupon-applied">
                  Aplicado: {appliedCoupon.code}
                </span>
              )}
            </div>

            <div className="checkout-coupon-row">
              <input
                type="text"
                className="checkout-coupon-input"
                placeholder="Digite seu cupom"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              />

              <button
                type="button"
                className="checkout-coupon-button"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon}
              >
                {isApplyingCoupon ? 'Aplicando...' : 'Aplicar'}
              </button>

              {appliedCoupon && (
                <button
                  type="button"
                  className="checkout-coupon-remove"
                  onClick={handleRemoveCoupon}
                >
                  Remover
                </button>
              )}
            </div>

            {couponMessage && (
              <div className="checkout-coupon-feedback checkout-coupon-feedback--success">
                {couponMessage}
              </div>
            )}

            {couponError && (
              <div className="checkout-coupon-feedback checkout-coupon-feedback--error">
                {couponError}
              </div>
            )}
          </div>

          <div className="checkout-methods">
            <button
              type="button"
              className={paymentMethod === 'card' ? 'checkout-method active' : 'checkout-method'}
              onClick={() => setPaymentMethod('card')}
            >
              Cartão
            </button>

            <button
              type="button"
              className={paymentMethod === 'pix' ? 'checkout-method active' : 'checkout-method'}
              onClick={() => setPaymentMethod('pix')}
            >
              PIX
            </button>

            <button
              type="button"
              className={paymentMethod === 'boleto' ? 'checkout-method active' : 'checkout-method'}
              onClick={() => setPaymentMethod('boleto')}
            >
              Boleto
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="checkout-card-layout">
              <div className="credit-card-preview">
                <div className="credit-card-preview__shine" />
                <span className="credit-card-chip" />
                <div className="credit-card-brand">{cardBrand}</div>

                <div className="credit-card-number">
                  {formattedCardNumber || '0000 0000 0000 0000'}
                </div>

                <div className="credit-card-footer">
                  <div>
                    <span className="credit-card-label">Nome</span>
                    <strong>{cardData.name || 'SEU NOME'}</strong>
                  </div>

                  <div>
                    <span className="credit-card-label">Validade</span>
                    <strong>{formattedExpiry || '00/00'}</strong>
                  </div>
                </div>
              </div>

              <div className="checkout-form">
                <label className="checkout-field">
                  <span>Nome no cartão</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Seu nome"
                    value={cardData.name}
                    onChange={handleCardChange}
                  />
                </label>

                <label className="checkout-field">
                  <span>Número do cartão</span>
                  <input
                    type="text"
                    name="number"
                    placeholder="0000 0000 0000 0000"
                    value={formattedCardNumber}
                    onChange={handleCardChange}
                  />
                </label>

                <div className="checkout-row">
                  <label className="checkout-field">
                    <span>Validade</span>
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/AA"
                      value={formattedExpiry}
                      onChange={handleCardChange}
                    />
                  </label>

                  <label className="checkout-field">
                    <span>CVV</span>
                    <input
                      type="text"
                      name="cvv"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'pix' && (
            <div className="checkout-alt-box">
              <div className="pix-box">
                <div className="pix-qr">
                  <div className="pix-scan-line" />
                </div>

                <div className="pix-content">
                  <h3>Pague com PIX</h3>
                  <p>
                    Escaneie o QR Code ou copie o código para concluir o pagamento.
                  </p>

                  <div className="pix-code">
                    00020126580014BR.GOV.BCB.PIX0136lumebooks-checkout-ebook520400005303986540539.905802BR5925LUMEBOOKS6009SAOPAULO62070503***
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'boleto' && (
            <div className="checkout-alt-box">
              <div className="boleto-box">
                <h3>Boleto bancário</h3>
                <p>
                  Gere seu boleto e pague até a data de vencimento. A liberação pode levar um
                  pouco mais.
                </p>

                <div className="boleto-code">
                  34191.79001 01043.510047 91020.150008 5 91740003990000
                </div>
              </div>
            </div>
          )}

          <div className="checkout-actions">
            <button
              className="checkout-pay-button"
              type="button"
              onClick={handleFinishPayment}
              disabled={isPaying}
            >
              {isPaying ? 'Processando pagamento...' : 'Finalizar pagamento'}
            </button>
          </div>
        </section>
      </section>
    </main>
  )
}