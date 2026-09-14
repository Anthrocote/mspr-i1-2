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
    public function findFilteredPaginated(?int $paysId, int $limit, int $offset): array
    {
        $qb = $this->createQueryBuilder('e')->orderBy('e.nom', 'ASC');

        if ($paysId !== null) {
            $qb->join('e.pays', 'p')
               ->andWhere('p.id = :paysId')
               ->setParameter('paysId', $paysId);
        }

        return QueryPaginator::paginate($qb, $limit, $offset);
    }
}
