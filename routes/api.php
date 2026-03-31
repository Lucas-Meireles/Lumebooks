<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminCouponController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicationController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\UserProgressController;

/*
|--------------------------------------------------------------------------
| Rotas públicas
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/reader-file/{id}', [PublicationController::class, 'readerFile']);
Route::get('/certificate/verify/{code}', [CertificateController::class, 'verify']);

// 🔥 ROTA DE TESTE (fora do auth)
Route::get('/test', function () {
    return response()->json([
        'message' => 'API funcionando 🚀'
    ]);
});

/*
|--------------------------------------------------------------------------
| Rotas autenticadas
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Publicações
    |--------------------------------------------------------------------------
    */
    Route::get('/publications', [PublicationController::class, 'index']);
    Route::get('/publications/{id}', [PublicationController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Compras
    |--------------------------------------------------------------------------
    */
    Route::post('/purchases', [PurchaseController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Cupons (cliente)
    |--------------------------------------------------------------------------
    */
    Route::post('/apply-coupon', [CouponController::class, 'apply']);
    Route::get('/my-first-purchase-coupon', [CouponController::class, 'firstPurchaseCoupon']);

    /*
    |--------------------------------------------------------------------------
    | Biblioteca
    |--------------------------------------------------------------------------
    */
    Route::get('/my-library', function (Request $request) {
        return $request->user()
            ->purchases()
            ->with('items.publication')
            ->get();
    });

    /*
    |--------------------------------------------------------------------------
    | Progresso
    |--------------------------------------------------------------------------
    */
    Route::get('/progress/{publicationId}', [UserProgressController::class, 'show']);
    Route::post('/progress', [UserProgressController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Certificados
    |--------------------------------------------------------------------------
    */
    Route::get('/certificate/{publicationId}', [CertificateController::class, 'show']);
    Route::post('/certificate/generate', [CertificateController::class, 'generate']);
    Route::get('/certificate/{publicationId}/download', [CertificateController::class, 'download']);

    /*
    |--------------------------------------------------------------------------
    | Perfil
    |--------------------------------------------------------------------------
    */
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile/avatar', [ProfileController::class, 'removeAvatar']);

    /*
    |--------------------------------------------------------------------------
    | Rotas admin
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->prefix('admin')->group(function () {

        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        Route::get('/categories', [AdminController::class, 'categories']);

        Route::get('/publications', [AdminController::class, 'publications']);
        Route::post('/publications', [AdminController::class, 'storePublication']);
        Route::post('/publications/{id}', [AdminController::class, 'updatePublication']);
        Route::delete('/publications/{id}', [AdminController::class, 'deletePublication']);

        Route::get('/clients', [AdminController::class, 'clients']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/search', [AdminUserController::class, 'search']);
        Route::post('/users/{id}/toggle-admin', [AdminUserController::class, 'toggleAdmin']);

        /*
        |--------------------------------------------------------------------------
        | Cupons (admin)
        |--------------------------------------------------------------------------
        */
        Route::get('/coupons', [AdminCouponController::class, 'index']);
        Route::post('/coupons', [AdminCouponController::class, 'store']);
        Route::put('/coupons/{id}', [AdminCouponController::class, 'update']);
        Route::delete('/coupons/{id}', [AdminCouponController::class, 'delete']);

        Route::get('/purchases', [AdminController::class, 'purchases']);
        Route::get('/certificates', [AdminController::class, 'certificates']);
    });

});