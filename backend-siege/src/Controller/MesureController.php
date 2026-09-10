<?php

namespace App\Controller;

use App\Repository\EntrepotRepository;
use App\Repository\MesureRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Mesures')]
class MesureController extends AbstractController
{
    public function __construct(
        private readonly MesureRepository  $mesureRepository,
        private readonly EntrepotRepository $entrepotRepository,
    ) {
    }

    #[Route('/api/mesures', name: 'api_mesures_list', methods: ['GET'])]
    #[OA\Get(path: '/api/mesures', summary: 'Liste les mesures IoT d\'un entrepôt avec filtre de dates')]
    #[OA\Parameter(name: 'entrepot_id', in: 'query', required: true,  schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'from',        in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Parameter(name: 'to',          in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Response(response: 200, description: 'Liste des mesures')]
    #[OA\Response(response: 400, description: 'Paramètre entrepot_id manquant')]
    public function list(Request $request): JsonResponse
    {
        $entrepotUuid = $request->query->get('entrepot_id');
        if ($entrepotUuid === null) {
            return $this->json(['error' => 'Le paramètre entrepot_id est requis'], 400);
        }

        $from = $request->query->get('from') ? new \DateTimeImmutable($request->query->get('from')) : null;
        $to   = $request->query->get('to')   ? new \DateTimeImmutable($request->query->get('to'))   : null;

        $mesures = $this->mesureRepository->findByEntrepot($entrepotUuid, $from, $to);

        return $this->json(array_map(fn ($m) => $this->serialize($m), $mesures));
    }

    #[Route('/api/entrepots/{uuid}/mesures', name: 'api_entrepots_mesures', methods: ['GET'])]
    #[OA\Get(path: '/api/entrepots/{uuid}/mesures', summary: 'Mesures IoT d\'un entrepôt donné')]
    #[OA\Response(response: 200, description: 'Liste des mesures')]
    #[OA\Response(response: 404, description: 'Entrepôt non trouvé')]
    public function listByEntrepot(string $uuid, Request $request): JsonResponse
    {
        $entrepot = $this->entrepotRepository->find($uuid);
        if ($entrepot === null) {
            return $this->json(['error' => 'Entrepôt non trouvé'], 404);
        }

        $from = $request->query->get('from') ? new \DateTimeImmutable($request->query->get('from')) : null;
        $to   = $request->query->get('to')   ? new \DateTimeImmutable($request->query->get('to'))   : null;

        $mesures = $this->mesureRepository->findByEntrepot($uuid, $from, $to);

        return $this->json(array_map(fn ($m) => $this->serialize($m), $mesures));
    }

    private function serialize(mixed $m): array
    {
        return [
            'uuid'        => (string) $m->getUuid(),
            'entrepotUuid'=> (string) $m->getEntrepot()->getUuid(),
            'temperature' => $m->getTemperature(),
            'humidite'    => $m->getHumidite(),
            'mesureLe'    => $m->getMesureLe()->format(\DateTimeInterface::ATOM),
            'syncedAt'    => $m->getSyncedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
