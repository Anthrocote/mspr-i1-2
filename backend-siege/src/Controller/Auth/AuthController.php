<?php

namespace App\Controller\Auth;

use App\Entity\Utilisateur;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class AuthController extends AbstractController
{
    #[Route('/api/auth/me', name: 'api_auth_me', methods: ['GET'])]
    #[OA\Get(path: '/api/auth/me', summary: 'Information about the authenticated user', tags: ['Auth'])]
    #[OA\Response(response: 200, description: 'Authenticated user')]
    #[OA\Response(response: 401, description: 'Not authenticated')]
    public function me(#[CurrentUser] Utilisateur $user): JsonResponse
    {
        return $this->json([
            'uuid'      => (string) $user->getUuid(),
            'email'     => $user->getEmail(),
            'lastName'  => $user->getNom(),
            'firstName' => $user->getPrenom(),
            'role'      => $user->getRole()->getLibelle(),
        ]);
    }
}
