<?php

namespace App\Providers;

use App\Models\Asset;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Map models to policies (add here if/when you create policy classes).
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // \App\Models\Purchase::class => \App\Policies\PurchasePolicy::class,
        // \App\Models\Asset::class    => \App\Policies\AssetPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        /**
         * Global admin override:
         * If a user is an admin, allow all abilities by default.
         * (Avoid calling $user->can() here to prevent recursion.)
         */
        Gate::before(function (?User $user, string $ability) {
            if (!$user) {
                return null;
            }

            // Property or helper methods your app might have:
            if ((isset($user->is_admin) && $user->is_admin) ||
                (method_exists($user, 'isAdmin') && $user->isAdmin()) ||
                (method_exists($user, 'hasRole') && $user->hasRole('admin'))
            ) {
                return true;
            }

            return null; // proceed to specific gates/policies
        });

        /**
         * Gate: grant-owned-asset
         * Who can manually grant an asset to a user? (Admins by default.)
         */
        Gate::define('grant-owned-asset', function (User $user) {
            // Gate::before already allows admins; return false for others by default.
            return false;
        });

        /**
         * Gate: revoke-owned-asset
         * Who can revoke an owned asset? (Admins by default.)
         */
        Gate::define('revoke-owned-asset', function (User $user, ?Purchase $purchase = null) {
            // Gate::before already allows admins; return false for others by default.
            return false;
        });

        /**
         * Gate: download-asset
         * Allow download if the user owns the asset (completed + not revoked).
         * Admins are already allowed by Gate::before.
         */
        Gate::define('download-asset', function (User $user, Asset $asset) {
            return $user->purchases()
                ->where('asset_id', $asset->id)
                ->where('status', Purchase::STATUS_COMPLETED)
                ->whereNull('revoked_at')
                ->exists();
        });
    }
}
