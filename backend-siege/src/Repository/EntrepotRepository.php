<?php

namespace App\Repository;

use App\Entity\Entrepot;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EntrepotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Entrepot::class);
    }

    /** @return Entrepot[] */
    public function findByPays(int $paysId): array
    {
        return $this->createQueryBuilder('e')
            ->join('e.pays', 'p')
            ->where('p.id = :paysId')
            ->setParameter('paysId', $paysId)
            ->orderBy('e.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
