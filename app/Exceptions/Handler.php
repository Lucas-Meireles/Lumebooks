use Illuminate\Auth\AuthenticationException;

protected function unauthenticated($request, AuthenticationException $exception)
{
    return response()->json([
        'message' => 'Não autenticado.'
    ], 401);
}