<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Firebase\JWT\JWT;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        
        $validator = Validator::make($request->all(), [
            'email'    => ['required','email'],
            'password' => ['required','string','min:4','max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = DB::table('users')->where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $secret = env('JWT_SECRET');
        if (!$secret) {
            return response()->json(['message' => 'JWT secret not configured'], 500);
        }

        $now = time();
        $exp = $now + (60 * 60);

        $payload = [
            'iss' => config('app.url'),
            'aud' => 'todo-api',
            'iat' => $now,
            'nbf' => $now,
            'exp' => $exp,
            'sub' => $user->id,
            'email' => $user->email,
            'name'  => $user->name,
        ];

        $jwt = JWT::encode($payload, $secret, 'HS256');

        return response()->json([
            'token' => $jwt,
            'expires_in' => $exp,
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ], 200);
    }
}
