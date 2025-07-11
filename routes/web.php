<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\ProfileController;

// Public Pages
Route::get('/', fn () => Inertia::render('GuestPages/Store'))->name('store');
Route::get('/contact', fn () => Inertia::render('GuestPages/ContactUs'))->name('contact');
Route::get('/privacy-policy', fn () => Inertia::render('GuestPages/PrivacyPolicy'))->name('privacy');

// ✅ Asset Details page — dynamic slug parameter
Route::get('/assets/{slug}', fn ($slug) =>
    Inertia::render('UserPages/AssetDetails', [
        'slug' => $slug // optional: pass the slug as prop if needed
    ])
)->name('assets.details');

// Guest-only Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);

    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);

    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);

    Route::get('/reset-password/{token}', [PasswordResetController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'store']);
});

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/buy-points', fn () => Inertia::render('UserPages/PurchasePoints'))->name('buy-points');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::delete('/profile/deactivate', [ProfileController::class, 'deactivate'])->name('profile.deactivate');
});

// Admin-only routes
Route::middleware(['auth', 'verified', 'is_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('AdminPages/Dashboard'))->name('dashboard');
    Route::get('/slides', fn () => Inertia::render('AdminPages/FrontPageSlides'))->name('slides');
    Route::get('/privacy', fn () => Inertia::render('AdminPages/PrivacyPolicy'))->name('privacy');
    Route::get('/contact', fn () => Inertia::render('AdminPages/ContactUs'))->name('contact');
    Route::get('/users', fn () => Inertia::render('AdminPages/UserList'))->name('users');
    Route::get('/store-points', fn () => Inertia::render('AdminPages/StorePoints'))->name('store-points');
    Route::get('/store-category', fn () => Inertia::render('AdminPages/StoreCategory'))->name('store-category');
    Route::get('/chat', fn () => Inertia::render('AdminPages/ChatSupport'))->name('chat');
    Route::get('/logs', fn () => Inertia::render('AdminPages/Logs'))->name('logs');
    Route::get('/backup', fn () => Inertia::render('AdminPages/BackupDatabase'))->name('backup');
});
