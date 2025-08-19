<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'file_path',
        'price',
        'is_featured',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Added this relationship - needed for loading category data
    public function category()
    {
        return $this->belongsTo(StoreCategory::class, 'category_id');
    }
}
