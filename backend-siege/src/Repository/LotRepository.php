<?php

namespace App\Repository;

use App\Entity\Lot;
use App\Pagination\QueryPaginator;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class LotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lot::class);
    }

    /** @return array{items: list<Lot>, total: int} Lots ordered by arrival date (FIFO), with optional filters */
    public function findFiltered(?string $entrepotUuid, ?string $statut, ?int $paysId, int $limit, int $offset): array
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

        $qb->orderBy('hs.dateArrivee', 'ASC');

        return QueryPaginator::paginate($qb, $limit, $offset, fetchJoinCollection: true);
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
