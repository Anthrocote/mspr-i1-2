<?php

namespace App\Repository;

use App\Entity\Lot;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class LotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lot::class);
    }

    /** @return Lot[] Lots triés par date d'arrivée croissante (FIFO), avec filtres optionnels */
    public function findFiltered(?string $entrepotUuid, ?string $statut, ?int $paysId): array
    {
        $qb = $this->createQueryBuilder('l')
            ->join('l.produit', 'p')
            ->leftJoin('l.historiqueStockages', 'hs')
            ->leftJoin('hs.entrepot', 'e')
            ->leftJoin('e.pays', 'pays');

        if ($statut !== null) {
            $qb->andWhere('l.statut = :statut')->setParameter('statut', $statut);
        }
        if ($entrepotUuid !== null) {
            $qb->andWhere('e.uuid = :entrepotUuid')->setParameter('entrepotUuid', $entrepotUuid);
        }
        if ($paysId !== null) {
            $qb->andWhere('pays.id = :paysId')->setParameter('paysId', $paysId);
        }

        return $qb
            ->orderBy('hs.dateArrivee', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /** @return Lot[] Lots dont la date d'arrivée dépasse 365 jours et statut non périmé */
    public function findLotsAnciens(): array
    {
        $limite = new \DateTimeImmutable('-365 days');

        return $this->createQueryBuilder('l')
            ->join('l.historiqueStockages', 'hs')
            ->where('hs.dateArrivee < :limite')
            ->andWhere('hs.dateDepart IS NULL')
            ->andWhere('l.statut != :statut')
            ->setParameter('limite', $limite)
            ->setParameter('statut', Lot::STATUT_PERIME)
            ->getQuery()
            ->getResult();
    }
}
