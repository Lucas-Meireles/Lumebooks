<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\Category;
use App\Models\User;
use App\Models\PurchaseItem;
use App\Models\LibraryItem;
use App\Models\UserProgress;

class Publication extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'publisher_user_id',
        'title',
        'slug',
        'short_description',
        'full_description',
        'cover_path',
        'file_path',
        'price',
        'is_published',
        'published_at'
    ];

    protected $casts = [
        'price' => 'float',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'publisher_user_id');
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function libraryItems()
    {
        return $this->hasMany(LibraryItem::class);
    }

    public function progress()
    {
        return $this->hasMany(UserProgress::class);
    }
}