<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'value',
        'minimum_amount',
        'usage_limit',
        'usage_limit_per_user',
        'first_purchase_only',
        'is_active',
        'category_id',
        'publication_id',
        'created_by',
        'starts_at',
        'expires_at',
    ];

    protected $casts = [
        'value' => 'float',
        'minimum_amount' => 'float',
        'first_purchase_only' => 'boolean',
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELACIONAMENTOS
    |--------------------------------------------------------------------------
    */

    public function usages()
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function publication()
    {
        return $this->belongsTo(Publication::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}