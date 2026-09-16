<?php

namespace App\Repository;

use App\Entity\Entrepot;
use App\Pagination\QueryPaginator;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EntrepotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Entrepot::class);
    }

    /** @return array{items: list<Entrepot>, total: int} */
    public function findFilteredPaginated(?string $paysCode, int $limit, int $offset): array
    {
        $qb = $this->createQueryBuilder('e')->orderBy('e.nom', 'ASC');

        if ($paysCode !== null) {
            $qb->join('e.pays', 'p')
               ->andWhere('p.code = :paysCode')
               ->setParameter('paysCode', $paysCode);
        }

        return QueryPaginator::paginate($qb, $limit, $offset);
    }
}
