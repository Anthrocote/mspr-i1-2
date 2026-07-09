<?php

namespace App\Controller;

use App\Repository\LotRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/lots', name: 'api_lots_')]
#[OA\Tag(name: 'Lots')]
class LotController extends AbstractController
{
    public function __construct(private readonly LotRepository $lotRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/lots', summary: 'Liste les lots (FIFO), filtrables')]
    #[OA\Parameter(name: 'entrepot_id', in: 'query', required: false, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'statut',      in: 'query', required: false, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'pays_id',     in: 'query', required: false, schema: new OA\Schema(type: 'integer'))]
    #[OA\Response(response: 200, description: 'Liste des lots')]
    public function list(Request $request): JsonResponse
    {
        $entrepotUuid = $request->query->get('entrepot_id');
        $statut       = $request->query->get('statut');
        $paysId       = $request->query->get('pays_id');

        $lots = $this->lotRepository->findFiltered(
            $entrepotUuid,
            $statut,
            $paysId !== null ? (int) $paysId : null
        );

        return $this->json(array_map(fn ($l) => $this->serializeSummary($l), $lots));
    }

    #[Route('/{uuid}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/lots/{uuid}', summary: 'Détail d\'un lot avec historique de stockage')]
    #[OA\Response(response: 200, description: 'Lot trouvé')]
    #[OA\Response(response: 404, description: 'Lot non trouvé')]
    public function show(string $uuid): JsonResponse
    {
        $lot = $this->lotRepository->find($uuid);
        if ($lot === null) {
            return $this->json(['error' => 'Lot non trouvé'], 404);
        }

        return $this->json($this->serializeDetail($lot));
    }

    private function serializeSummary(mixed $l): array
    {
        return [
            'uuid'      => (string) $l->getUuid(),
            'libelle'   => $l->getLibelle(),
            'quantite'  => $l->getQuantite(),
            'statut'    => $l->getStatut(),
            'syncedAt'  => $l->getSyncedAt()->format(\DateTimeInterface::ATOM),
            'produit'   => [
                'uuid' => (string) $l->getProduit()->getUuid(),
                'nom'  => $l->getProduit()->getNom(),
            ],
        ];
    }

    private function serializeDetail(mixed $l): array
    {
        $data = $this->serializeSummary($l);
        $data['historiqueStockage'] = array_map(fn ($hs) => [
            'entrepot'    => [
                'uuid' => (string) $hs->getEntrepot()->getUuid(),
                'nom'  => $hs->getEntrepot()->getNom(),
            ],
            'dateArrivee' => $hs->getDateArrivee()->format(\DateTimeInterface::ATOM),
            'dateDepart'  => $hs->getDateDepart()?->format(\DateTimeInterface::ATOM),
        ], $l->getHistoriqueStockages()->toArray());

        return $data;
    }
}
