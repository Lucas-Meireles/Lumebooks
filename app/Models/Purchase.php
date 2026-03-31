<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\User;
use App\Models\PurchaseItem;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'purchase_code',
        'subtotal_amount',
        'discount_amount',
        'total_amount',
        'payment_status',
        'payment_method',
        'purchased_at',
    ];

    protected $casts = [
        'subtotal_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'purchased_at' => 'datetime',
    ];

    // 🔗 Relacionamentos

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}