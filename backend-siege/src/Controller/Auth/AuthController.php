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
    #[OA\Get(path: '/api/auth/me', summary: 'Informations de l\'utilisateur connecté', tags: ['Auth'])]
    #[OA\Response(response: 200, description: 'Utilisateur authentifié')]
    #[OA\Response(response: 401, description: 'Non authentifié')]
    public function me(#[CurrentUser] Utilisateur $user): JsonResponse
    {
        return $this->json([
            'uuid'   => (string) $user->getUuid(),
            'email'  => $user->getEmail(),
            'nom'    => $user->getNom(),
            'prenom' => $user->getPrenom(),
            'role'   => $user->getRole()->getLibelle(),
        ]);
    }
}
