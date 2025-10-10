<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;

// Controllers
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\UserAssetOwnedController;
use App\Http\Controllers\Admin\SlideController;
use App\Http\Controllers\Admin\PolicyController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Admin\ContactSettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\StoreCategoryController;
use App\Http\Controllers\Admin\AssetController;
use App\Http\Controllers\Admin\ChatController;
use App\Http\Controllers\Admin\LogsController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\StorePointsController;
use App\Http\Controllers\AssetInteractionController;
use App\Http\Controllers\Admin\StorePlanController;
use App\Http\Controllers\ChatSupportController;
use App\Http\Controllers\Admin\UserOwnedAssetController;

/*
|--------------------------------------------------------------------------
| Public (Guest)
|--------------------------------------------------------------------------
*/
Route::get('/', function (Request $request, StorefrontController $ctrl) {
    return $ctrl->index($request);
})->name('store');

Route::get('/contact', fn () => Inertia::render('GuestPages/ContactUs'))->name('contact');
Route::get('/privacy-policy', fn () => Inertia::render('GuestPages/PrivacyPolicy'))->name('privacy');

// Guest asset detail (preloaded)
Route::get('/assets/{slug}', [AssetController::class, 'showBySlug'])->name('assets.details');

/**
 * Make views endpoint PUBLIC (accessible by guests and logged-in users).
 * IMPORTANT: iisang route lang ito para walang conflict sa guest/auth.
 */
Route::post('/assets/{asset}/views', [AssetInteractionController::class, 'viewsStore'])
    ->whereNumber('asset')
    ->name('assets.views.store');

/*
|--------------------------------------------------------------------------
| Guest Auth
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);

    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);

    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);

    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Authenticated (User)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::delete('/profile/deactivate', [ProfileController::class, 'deactivate'])->name('profile.deactivate');

    // Chat Support
    Route::prefix('chat')->name('chat.')->group(function () {
        Route::get   ('/conversations',                         [ChatSupportController::class, 'index'])->name('conversations.index');
        Route::post  ('/conversations',                         [ChatSupportController::class, 'store'])->name('conversations.store');
        Route::get   ('/conversations/{conversation}',          [ChatSupportController::class, 'show'])->name('conversations.show');
        Route::post  ('/conversations/{conversation}/messages', [ChatSupportController::class, 'sendMessage'])->name('messages.store');
        Route::put   ('/conversations/{conversation}/status',   [ChatSupportController::class, 'updateStatus'])->name('conversations.status');
        Route::delete('/messages/{message}',                    [ChatSupportController::class, 'destroyMessage'])->name('messages.destroy');
    });


        // Purchase Plans
    Route::get ('/buy-points',       [PurchaseController::class, 'index'])->name('buy-points');
    Route::post('/paymongo/source',  [PurchaseController::class, 'createSource'])->name('paymongo.source');
    Route::post('/paymongo/payment', [PurchaseController::class, 'createPayment'])->name('paymongo.payment');

    Route::get ('/payment-success',  [PurchaseController::class, 'success'])->name('payment.success');
    Route::get ('/payment-failed',   [PurchaseController::class, 'failed'])->name('payment.failed');
    
    // Owned Assets (User-facing) — keep a single block only
    Route::prefix('my')->name('user.')->group(function () {
        Route::get('/owned-assets', [UserAssetOwnedController::class, 'index'])
            ->name('owned-assets.index');

        Route::get('/owned-assets/{asset}/download', [UserAssetOwnedController::class, 'download'])
            ->whereNumber('asset')
            ->name('owned-assets.download');
    });

    // Asset Interactions (CRUD) — keep these auth-scoped endpoints
    Route::prefix('assets/{asset}')
        ->where(['asset' => '[0-9]+'])
        ->controller(AssetInteractionController::class)
        ->group(function () {
            Route::get   ('/comments',         'commentsIndex')->name('assets.comments.index');
            Route::post  ('/comments',         'commentsStore')->name('assets.comments.store');
            Route::put   ('/comments/{id}',    'commentsUpdate')->name('assets.comments.update');
            Route::delete('/comments/{id}',    'commentsDestroy')->name('assets.comments.destroy');

            Route::get   ('/ratings',          'ratingsIndex')->name('assets.ratings.index');
            Route::post  ('/ratings',          'ratingsStore')->name('assets.ratings.store');
            Route::put   ('/ratings/{id}',     'ratingsUpdate')->name('assets.ratings.update');
            Route::delete('/ratings/{id}',     'ratingsDestroy')->name('assets.ratings.destroy');

            Route::get   ('/favorites',        'favoritesIndex')->name('assets.favorites.index');
            Route::post  ('/favorites',        'favoritesStore')->name('assets.favorites.store');
            Route::delete('/favorites/{id}',   'favoritesDestroy')->name('assets.favorites.destroy');

            Route::get   ('/views',            'viewsIndex')->name('assets.views.index');
            // NOTE: wala nang POST /views dito; nasa public route na sa taas para iwas conflict
        });
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'is_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('AdminPages/Dashboard'))->name('dashboard');
        Route::get('/dashboard-stats', [AdminDashboardController::class, 'stats'])->name('dashboard.stats');
        Route::get('/slides', fn () => Inertia::render('AdminPages/FrontPageSlides'))->name('slides');
        Route::get('/privacy', fn () => Inertia::render('AdminPages/PrivacyPolicy'))->name('privacy');
        Route::get('/contact', fn () => Inertia::render('AdminPages/ContactUs'))->name('contact');

        // Users
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        Route::get('/store-points', fn () => Inertia::render('AdminPages/StorePoints'))->name('store-points');
        Route::get('/store-category', fn () => Inertia::render('AdminPages/StoreCategory'))->name('store-category');
        Route::get('/chat', fn () => Inertia::render('AdminPages/ChatSupport'))->name('chat');
        Route::get('/logs', fn () => Inertia::render('AdminPages/Logs'))->name('logs');
        Route::get('/backup', fn () => Inertia::render('AdminPages/BackupDatabase'))->name('backup');

        // APIs
        Route::get('/slides-data', [SlideController::class, 'index']);
        Route::get('/slides-data/{slide}', [SlideController::class, 'show']);
        Route::post('/slides-data', [SlideController::class, 'store']);
        Route::put('/slides-data/{slide}', [SlideController::class, 'update']);
        Route::delete('/slides-data/{slide}', [SlideController::class, 'destroy']);

        Route::get('/policy', [PolicyController::class, 'index']);
        Route::post('/policy', [PolicyController::class, 'store']);
        Route::put('/policy/{type}', [PolicyController::class, 'update']);
        Route::delete('/policy/{type}', [PolicyController::class, 'destroy']);

        Route::get('/contact-setting', [ContactSettingController::class, 'show']);
        Route::put('/contact-setting', [ContactSettingController::class, 'update']);

        Route::resource('/store-categories', StoreCategoryController::class);
        Route::resource('/assets', AssetController::class);

        Route::get('/chat/conversations', [ChatController::class, 'getConversations']);
        Route::get('/chat/conversations/{conversation}', [ChatController::class, 'getMessages']);
        Route::post('/chat/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
        Route::put('/chat/conversations/{conversation}/status', [ChatController::class, 'updateConversationStatus']);
        Route::put('/chat/conversations/{conversation}/priority', [ChatController::class, 'updateConversationPriority']);
        Route::get('/chat/stats', [ChatController::class, 'getStats']);
        Route::get('/chat/search', [ChatController::class, 'searchConversations']);

        Route::get('/logs/purchases', [LogsController::class, 'purchases']);
        Route::get('/logs/downloads', [LogsController::class, 'downloads']);
        Route::get('/logs/active-games', [LogsController::class, 'activeGames']);
        Route::get('/logs/stats', [LogsController::class, 'stats']);
        Route::get('/logs/export', [LogsController::class, 'export']);

        Route::get('/backups', [BackupController::class, 'index']);
        Route::post('/backups', [BackupController::class, 'store']);
        Route::get('/backups/{backup}', [BackupController::class, 'show']);
        Route::put('/backups/{backup}', [BackupController::class, 'update']);
        Route::delete('/backups/{backup}', [BackupController::class, 'destroy']);

        Route::get('/store-points/data', [StorePointsController::class, 'index']);
        Route::post('/store-points/source', [StorePointsController::class, 'createSource']);
        Route::post('/store-points/payment', [StorePointsController::class, 'createPayment']);
        Route::put('/store-points/{id}', [StorePointsController::class, 'update']);
        Route::delete('/store-points/{id}', [StorePointsController::class, 'destroy']);
        Route::post('/store-points/keys', [StorePointsController::class, 'saveKeys']);
        Route::get('/store-points/keys', [StorePointsController::class, 'getKeys']);
        Route::get('/payment-success', fn () => Inertia::render('AdminPages/StorePoints/PaymentSuccess'));
        Route::get('/payment-failed', fn () => Inertia::render('Admin/StorePoints/PaymentFailedPage'));

        Route::get('/store-plans',        [StorePlanController::class, 'index']);
        Route::post('/store-plans',       [StorePlanController::class, 'store']);
        Route::put('/store-plans/{id}',   [StorePlanController::class, 'update']);
        Route::delete('/store-plans/{id}',[StorePlanController::class, 'destroy']);

        // Asset Ownership (used by Users admin page)
        Route::get('/users/{user}/owned-assets', [UserOwnedAssetController::class, 'index'])
            ->name('users.owned-assets.index');
        Route::post('/users/{user}/owned-assets', [UserOwnedAssetController::class, 'store'])
            ->name('users.owned-assets.store');
        Route::patch('/owned-assets/{purchase}', [UserOwnedAssetController::class, 'update'])
            ->name('owned-assets.update');
        Route::delete('/owned-assets/{purchase}', [UserOwnedAssetController::class, 'destroy'])
            ->name('owned-assets.destroy');
        Route::get('/assets-light', [UserOwnedAssetController::class, 'assetsLight'])
            ->name('assets.light');
    });
