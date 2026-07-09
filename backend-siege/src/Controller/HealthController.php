<?php

namespace App\Controller;

use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class HealthController extends AbstractController
{
    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    #[OA\Get(path: '/api/health', summary: 'Vérifie que le serveur répond', tags: ['System'])]
    #[OA\Response(response: 200, description: 'Serveur opérationnel')]
    public function health(): JsonResponse
    {
        return $this->json(['status' => 'ok']);
    }
}
