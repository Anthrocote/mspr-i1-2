<?php

namespace App\Repository;

use App\Entity\Alerte;
use App\Pagination\QueryPaginator;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AlerteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Alerte::class);
    }

    public const STATUS_ACTIVE   = 'active';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_ALL      = 'all';

    /**
     * @param string $status one of active|resolved|all (see STATUS_* constants)
     * @return array{items: list<Alerte>, total: int} Alerts (newest first), filtered by
     *   status, type, country and triggered-at date range
     */
    public function findFiltered(
        string $status,
        ?string $type,
        ?int $paysId,
        ?\DateTimeImmutable $from,
        ?\DateTimeImmutable $to,
        int $limit,
        int $offset,
    ): array {
        // Active (unresolved) alerts first, then most-recent first within each
        // group: what still needs attention rises to the top of the history.
        $qb = $this->createQueryBuilder('a')
            ->addSelect('CASE WHEN a.resolueLe IS NULL THEN 0 ELSE 1 END AS HIDDEN activeOrder')
            ->orderBy('activeOrder', 'ASC')
            ->addOrderBy('a.declencheeLe', 'DESC');

        // Default (and any unknown value) keeps the historical active-only view.
        if ($status === self::STATUS_RESOLVED) {
            $qb->andWhere('a.resolueLe IS NOT NULL');
        } elseif ($status !== self::STATUS_ALL) {
            $qb->andWhere('a.resolueLe IS NULL');
        }

        if ($type !== null) {
            $qb->andWhere('a.type = :type')->setParameter('type', $type);
        }
        if ($paysId !== null) {
            $qb->leftJoin('a.entrepot', 'e')
               ->leftJoin('e.pays', 'p')
               ->andWhere('p.id = :paysId')
               ->setParameter('paysId', $paysId);
        }
        if ($from !== null) {
            $qb->andWhere('a.declencheeLe >= :from')->setParameter('from', $from);
        }
        if ($to !== null) {
            $qb->andWhere('a.declencheeLe <= :to')->setParameter('to', $to);
        }

        return QueryPaginator::paginate($qb, $limit, $offset);
    }
}
