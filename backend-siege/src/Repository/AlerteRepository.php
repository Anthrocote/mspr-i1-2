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

    /** @return array{items: list<Alerte>, total: int} Active (unresolved) alerts, with optional filters */
    public function findActives(?string $type, ?int $paysId, int $limit, int $offset): array
    {
        $qb = $this->createQueryBuilder('a')
            ->where('a.resolueLe IS NULL')
            ->orderBy('a.declencheeLe', 'DESC');

        if ($type !== null) {
            $qb->andWhere('a.type = :type')->setParameter('type', $type);
        }
        if ($paysId !== null) {
            $qb->leftJoin('a.entrepot', 'e')
               ->leftJoin('e.pays', 'p')
               ->andWhere('p.id = :paysId')
               ->setParameter('paysId', $paysId);
        }

        return QueryPaginator::paginate($qb, $limit, $offset);
    }
}
