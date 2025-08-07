<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSetting extends Model
{
    protected $fillable = [
        'email', 'facebook', 'discord', 'phone', 'address', 'website'
    ];
}
