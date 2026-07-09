<?php

namespace App\Repository;

use App\Entity\Alerte;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AlerteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Alerte::class);
    }

    /** @return Alerte[] Alertes actives (non résolues), avec filtres optionnels */
    public function findActives(?string $type = null, ?int $paysId = null): array
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

        return $qb->getQuery()->getResult();
    }
}
