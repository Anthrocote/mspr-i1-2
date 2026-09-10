<?php

namespace App\Repository;

use App\Entity\Mesure;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MesureRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Mesure::class);
    }

    /** @return Mesure[] Historique de mesures d'un entrepôt, avec filtre optionnel de plage de dates */
    public function findByEntrepot(string $entrepotUuid, ?\DateTimeImmutable $from = null, ?\DateTimeImmutable $to = null): array
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

        return $qb->getQuery()->getResult();
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
