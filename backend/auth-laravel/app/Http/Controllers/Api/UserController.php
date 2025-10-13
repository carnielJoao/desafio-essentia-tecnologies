<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\User;

class UserController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $perPage = min((int) $request->query('per_page', 10), 50);
        $q = trim((string) $request->query('q', ''));
        $query = \App\Models\User::select(['id','name','email','created_at','updated_at'])->orderByDesc('id');
        if ($q !== '') {
            $query->where(function($w) use ($q){
                $w->where('name','like',"%{$q}%")->orWhere('email','like',"%{$q}%");
            });
        }
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required','string','min:3'],
            'email'    => ['required','email', Rule::unique('users','email')],
            'password' => ['required','string','min:6'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email'=> $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        return response()->json($user->only(['id','name','email','created_at','updated_at']), 201);
    }

    public function update(Request $request, $id)
    {
        $user = \App\Models\User::findOrFail($id);

        $data = $request->validate([
            'name'  => ['required','string','min:3'],
            'email' => ['required','email', \Illuminate\Validation\Rule::unique('users','email')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json($user->only(['id','name','email','created_at','updated_at']));
    }

    public function destroy($id)
    {
        $user = \App\Models\User::findOrFail($id);
        $user->delete();

        return response()->json(['deleted' => true]);
    }


}
