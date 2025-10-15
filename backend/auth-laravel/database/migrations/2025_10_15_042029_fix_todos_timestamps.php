<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE todos SET created_at = NOW() WHERE created_at IS NULL");
        DB::statement("UPDATE todos SET updated_at = COALESCE(updated_at, created_at, NOW()) WHERE updated_at IS NULL");

        Schema::table('todos', function (Blueprint $table) {
        });

        DB::statement("
          ALTER TABLE todos
            MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            MODIFY updated_at DATETIME NOT NULL
              DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP
        ");
    }

    public function down(): void
    {
        DB::statement("
          ALTER TABLE todos
            MODIFY created_at DATETIME NULL,
            MODIFY updated_at DATETIME NULL
        ");
    }
};
