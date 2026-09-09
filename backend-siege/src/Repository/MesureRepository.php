<?php

namespace App\Repository;

use App\Entity\Mesure;
use App\Pagination\QueryPaginator;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MesureRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Mesure::class);
    }

    /** @return array{items: list<Mesure>, total: int} Measurement history of a warehouse, with optional date range filter */
    public function findByEntrepot(string $entrepotUuid, ?\DateTimeImmutable $from, ?\DateTimeImmutable $to, int $limit, int $offset): array
    {
        $qb = $this->createQueryBuilder('m')
            ->join('m.entrepot', 'e')
            ->where('e.uuid = :uuid')
            ->setParameter('uuid', $entrepotUuid)
            ->orderBy('m.mesureLe', 'ASC');

        if ($from !== null) {
            $qb->andWhere('m.mesureLe >= :from')->setParameter('from', $from);
        }
        if ($to !== null) {
            $qb->andWhere('m.mesureLe <= :to')->setParameter('to', $to);
        }

        return QueryPaginator::paginate($qb, $limit, $offset);
    }

    /** Dernière mesure connue d'un entrepôt */
    public function findLastByEntrepot(string $entrepotUuid): ?Mesure
    {
        return $this->createQueryBuilder('m')
            ->join('m.entrepot', 'e')
            ->where('e.uuid = :uuid')
            ->setParameter('uuid', $entrepotUuid)
            ->orderBy('m.mesureLe', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
