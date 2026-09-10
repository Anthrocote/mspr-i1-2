<?php

namespace App\Controller;

use App\Repository\EntrepotRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/entrepots', name: 'api_entrepots_')]
#[OA\Tag(name: 'Entrepôts')]
class EntrepotController extends AbstractController
{
    public function __construct(private readonly EntrepotRepository $entrepotRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/entrepots', summary: 'Liste les entrepôts, filtrables par pays')]
    #[OA\Parameter(name: 'pays_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))]
    #[OA\Response(response: 200, description: 'Liste des entrepôts')]
    public function list(Request $request): JsonResponse
    {
        $paysId = $request->query->get('pays_id');

        $entrepots = $paysId !== null
            ? $this->entrepotRepository->findByPays((int) $paysId)
            : $this->entrepotRepository->findAll();

        return $this->json(array_map(fn ($e) => $this->serialize($e), $entrepots));
    }

    #[Route('/{uuid}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/entrepots/{uuid}', summary: 'Détail d\'un entrepôt')]
    #[OA\Response(response: 200, description: 'Entrepôt trouvé')]
    #[OA\Response(response: 404, description: 'Entrepôt non trouvé')]
    public function show(string $uuid): JsonResponse
    {
        $entrepot = $this->entrepotRepository->find($uuid);
        if ($entrepot === null) {
            return $this->json(['error' => 'Entrepôt non trouvé'], 404);
        }

        return $this->json($this->serialize($entrepot));
    }

    private function serialize(mixed $e): array
    {
        return [
            'uuid'       => (string) $e->getUuid(),
            'nom'        => $e->getNom(),
            'numeroRue'  => $e->getNumeroRue(),
            'adresse'    => $e->getAdresse(),
            'codePostal' => $e->getCodePostal(),
            'ville'      => $e->getVille(),
            'actif'      => $e->isActif(),
            'pays'       => [
                'id'      => $e->getPays()->getId(),
                'nom'     => $e->getPays()->getNom(),
                'codeIso' => $e->getPays()->getCodeIso(),
            ],
        ];
    }
}
