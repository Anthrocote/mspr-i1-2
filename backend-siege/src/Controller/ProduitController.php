<?php

namespace App\Controller;

use App\Pagination\Pagination;
use App\Repository\ProduitRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
    #[OA\Parameter(name: 'page',  in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated list of products')]
    public function list(Request $request): JsonResponse
    {
        $pagination = Pagination::fromRequest($request);
        $result = $this->produitRepository->findPaginated($pagination->getLimit(), $pagination->getOffset());

        $data = array_map(fn ($p) => $this->serialize($p), $result['items']);

        return $this->json($pagination->envelope($data, $result['total']));
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
