<?php

namespace App\Controller;

use App\Repository\AlerteRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/alertes', name: 'api_alertes_')]
#[OA\Tag(name: 'Alertes')]
class AlerteController extends AbstractController
{
    public function __construct(
        private readonly AlerteRepository      $alerteRepository,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/alertes', summary: 'Liste les alertes actives (non résolues)')]
    #[OA\Parameter(name: 'type',    in: 'query', required: false, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'pays_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))]
    #[OA\Response(response: 200, description: 'Liste des alertes')]
    public function list(Request $request): JsonResponse
    {
        $type   = $request->query->get('type');
        $paysId = $request->query->get('pays_id');

        $alertes = $this->alerteRepository->findActives(
            $type,
            $paysId !== null ? (int) $paysId : null
        );

        return $this->json(array_map(fn ($a) => $this->serialize($a), $alertes));
    }

    #[Route('/{uuid}/resolve', name: 'resolve', methods: ['PATCH'])]
    #[OA\Patch(path: '/api/alertes/{uuid}/resolve', summary: 'Marquer une alerte comme résolue')]
    #[OA\Response(response: 200, description: 'Alerte résolue')]
    #[OA\Response(response: 404, description: 'Alerte non trouvée')]
    #[OA\Response(response: 409, description: 'Alerte déjà résolue')]
    public function resolve(string $uuid): JsonResponse
    {
        $alerte = $this->alerteRepository->find($uuid);
        if ($alerte === null) {
            return $this->json(['error' => 'Alerte non trouvée'], 404);
        }
        if ($alerte->getResolueLe() !== null) {
            return $this->json(['error' => 'Alerte déjà résolue'], 409);
        }

        $alerte->setResolueLe(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json($this->serialize($alerte));
    }

    private function serialize(mixed $a): array
    {
        return [
            'uuid'          => (string) $a->getUuid(),
            'type'          => $a->getType(),
            'declencheeLe'  => $a->getDeclencheeLe()->format(\DateTimeInterface::ATOM),
            'resolueLe'     => $a->getResolueLe()?->format(\DateTimeInterface::ATOM),
            'lot'           => $a->getLot() ? [
                'uuid'    => (string) $a->getLot()->getUuid(),
                'libelle' => $a->getLot()->getLibelle(),
            ] : null,
            'entrepot'      => $a->getEntrepot() ? [
                'uuid' => (string) $a->getEntrepot()->getUuid(),
                'nom'  => $a->getEntrepot()->getNom(),
            ] : null,
        ];
    }
}
