<?php

namespace App\Controller;

use App\Pagination\Pagination;
use App\Repository\AlerteRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/alerts', name: 'api_alertes_')]
#[OA\Tag(name: 'Alerts')]
class AlerteController extends AbstractController
{
    public function __construct(
        private readonly AlerteRepository      $alerteRepository,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/alerts', summary: 'List alerts (newest first), filterable by status/type/country/date')]
    #[OA\Parameter(name: 'status',     in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['active', 'resolved', 'all'], default: 'active'))]
    #[OA\Parameter(name: 'type',       in: 'query', required: false, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'country',    in: 'query', required: false, schema: new OA\Schema(type: 'string'), description: '2-letter ISO country code')]
    #[OA\Parameter(name: 'from',       in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Parameter(name: 'to',         in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Parameter(name: 'page',       in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit',      in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated list of alerts')]
    public function list(Request $request): JsonResponse
    {
        $status     = $request->query->get('status', AlerteRepository::STATUS_ACTIVE);
        $type       = $request->query->get('type');
        $paysCode   = $request->query->get('country');
        $from       = $this->parseDate($request->query->get('from'));
        $to         = $this->parseDate($request->query->get('to'));
        $pagination = Pagination::fromRequest($request);

        $result = $this->alerteRepository->findFiltered(
            $status,
            $type,
            $paysCode !== null ? (string) $paysCode : null,
            $from,
            $to,
            $pagination->getLimit(),
            $pagination->getOffset(),
        );

        $data = array_map(fn ($a) => $this->serialize($a), $result['items']);

        return $this->json($pagination->envelope($data, $result['total']));
    }

    // Lenient ISO-8601 date parsing: an unparseable value is treated as "no
    // bound" rather than a 400, so a malformed filter never breaks the list.
    private function parseDate(?string $value): ?\DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }
        try {
            return new \DateTimeImmutable($value);
        } catch (\Exception) {
            return null;
        }
    }

    #[Route('/{uuid}/resolve', name: 'resolve', methods: ['PATCH'])]
    #[OA\Patch(path: '/api/alerts/{uuid}/resolve', summary: 'Mark an alert as resolved')]
    #[OA\Response(response: 200, description: 'Alert resolved')]
    #[OA\Response(response: 404, description: 'Alert not found')]
    #[OA\Response(response: 409, description: 'Alert already resolved')]
    public function resolve(string $uuid): JsonResponse
    {
        $alerte = $this->alerteRepository->find($uuid);
        if ($alerte === null) {
            return $this->json(['error' => 'Alert not found'], 404);
        }
        if ($alerte->getResolueLe() !== null) {
            return $this->json(['error' => 'Alert already resolved'], 409);
        }

        $alerte->setResolueLe(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json($this->serialize($alerte));
    }

    private function serialize(mixed $a): array
    {
        return [
            'uuid'         => (string) $a->getUuid(),
            'type'         => $a->getType(),
            'triggeredAt'  => $a->getDeclencheeLe()->format(\DateTimeInterface::ATOM),
            'resolvedAt'   => $a->getResolueLe()?->format(\DateTimeInterface::ATOM),
            'lot'          => $a->getLot() ? [
                'uuid'  => (string) $a->getLot()->getUuid(),
                'label' => $a->getLot()->getLibelle(),
            ] : null,
            'warehouse'    => $a->getEntrepot() ? [
                'uuid' => (string) $a->getEntrepot()->getUuid(),
                'name' => $a->getEntrepot()->getNom(),
            ] : null,
        ];
    }
}
