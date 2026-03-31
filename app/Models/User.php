<?php

namespace App\Models;

use App\Models\Certificate;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\LibraryItem;
use App\Models\Publication;
use App\Models\Purchase;
use App\Models\UserProgress;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'cpf',
        'phone',
        'email',
        'password',
        'is_admin',
        'avatar_path',
        'display_name',
        'bio',
        'profile_theme',
        'avatar_config',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'avatar_config' => 'array',
        ];
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function libraryItems()
    {
        return $this->hasMany(LibraryItem::class);
    }

    public function publishedPublications()
    {
        return $this->hasMany(Publication::class, 'publisher_user_id');
    }

    public function progress()
    {
        return $this->hasMany(UserProgress::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function couponUsages()
    {
        return $this->hasMany(CouponUsage::class);
    }
}