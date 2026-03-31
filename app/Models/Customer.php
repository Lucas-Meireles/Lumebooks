<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// 👇 IMPORT
use App\Models\User;

class Customer extends Model
{
    use HasFactory;

    // 👇 CAMPOS QUE PODEM SER PREENCHIDOS
    protected $fillable = [
        'user_id',
        'cpf',
        'phone',
        'birth_date',
        'status',
    ];

    /**
     * RELACIONAMENTO
     */

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}