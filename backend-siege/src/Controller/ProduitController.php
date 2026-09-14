<?php

namespace App\Controller;

use App\Repository\ProduitRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/products', name: 'api_produits_')]
#[OA\Tag(name: 'Products')]
class ProduitController extends AbstractController
{
    public function __construct(private readonly ProduitRepository $produitRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/products', summary: 'List all products')]
    #[OA\Response(response: 200, description: 'List of products')]
    public function list(): JsonResponse
    {
        $produits = $this->produitRepository->findAll();

        return $this->json(array_map(fn ($p) => $this->serialize($p), $produits));
    }

    #[Route('/{uuid}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/products/{uuid}', summary: 'Product detail')]
    #[OA\Response(response: 200, description: 'Product found')]
    #[OA\Response(response: 404, description: 'Product not found')]
    public function show(string $uuid): JsonResponse
    {
        $produit = $this->produitRepository->find($uuid);
        if ($produit === null) {
            return $this->json(['error' => 'Product not found'], 404);
        }

        return $this->json($this->serialize($produit));
    }

    private function serialize(mixed $p): array
    {
        return [
            'uuid'        => (string) $p->getUuid(),
            'name'        => $p->getNom(),
            'description' => $p->getDescription(),
            'variety'     => $p->getVariete(),
            'intensity'   => $p->getIntensite(),
            'bitterness'  => $p->getAmertume(),
            'acidity'     => $p->getAcidite(),
            'body'        => $p->getCorps(),
        ];
    }
}
