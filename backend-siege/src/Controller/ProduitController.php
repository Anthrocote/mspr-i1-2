<?php

namespace App\Controller;

use App\Repository\ProduitRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/produits', name: 'api_produits_')]
#[OA\Tag(name: 'Produits')]
class ProduitController extends AbstractController
{
    public function __construct(private readonly ProduitRepository $produitRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/produits', summary: 'Liste tous les produits')]
    #[OA\Response(response: 200, description: 'Liste des produits')]
    public function list(): JsonResponse
    {
        $produits = $this->produitRepository->findAll();

        return $this->json(array_map(fn ($p) => $this->serialize($p), $produits));
    }

    #[Route('/{uuid}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/produits/{uuid}', summary: 'Détail d\'un produit')]
    #[OA\Response(response: 200, description: 'Produit trouvé')]
    #[OA\Response(response: 404, description: 'Produit non trouvé')]
    public function show(string $uuid): JsonResponse
    {
        $produit = $this->produitRepository->find($uuid);
        if ($produit === null) {
            return $this->json(['error' => 'Produit non trouvé'], 404);
        }

        return $this->json($this->serialize($produit));
    }

    private function serialize(mixed $p): array
    {
        return [
            'uuid'        => (string) $p->getUuid(),
            'nom'         => $p->getNom(),
            'description' => $p->getDescription(),
            'variete'     => $p->getVariete(),
            'intensite'   => $p->getIntensite(),
            'amertume'    => $p->getAmertume(),
            'acidite'     => $p->getAcidite(),
            'corps'       => $p->getCorps(),
        ];
    }
}
