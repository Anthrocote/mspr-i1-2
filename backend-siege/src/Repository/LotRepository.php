<?php

namespace App\Repository;

use App\Entity\HistoriqueStockage;
use App\Entity\Lot;
use App\Pagination\QueryPaginator;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Query\Expr\Join;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class LotRepository extends ServiceEntityRepository
{
    /** Age buckets, expressed as the lot start date compared to "now minus N days". */
    private const AGE_LT90 = 'lt90';
    private const AGE_90_180 = '90_180';
    private const AGE_180_365 = '180_365';
    private const AGE_GT365 = 'gt365';

    public const AGE_BUCKETS = [self::AGE_LT90, self::AGE_90_180, self::AGE_180_365, self::AGE_GT365];

    public const SORT_KEYS = ['id', 'country', 'warehouse', 'duration', 'status'];

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lot::class);
    }

    /**
     * Server-side listing of lots with filtering, search, age bucket and column
     * sorting, all applied BEFORE pagination.
     *
     * The lot start date (used by both the age filter and the duration sort) is
     * COALESCE(constitueeLe, MIN(dateArrivee)) — the exact rule
     * LotController::durationDays() uses, so the two never disagree.
     *
     * @param string|null $search      case-insensitive substring on lot label, product,
     *                                  warehouse and country names
     * @param string|null $age         one of self::AGE_BUCKETS, ignored otherwise
     * @param string|null $sort        one of self::SORT_KEYS, FIFO default otherwise
     * @param string|null $order       'asc' | 'desc' (default 'asc')
     *
     * @return array{items: list<Lot>, total: int}
     */
    public function findFiltered(
        ?string $entrepotUuid,
        ?string $statut,
        ?int $paysId,
        int $limit,
        int $offset,
        ?string $search = null,
        ?string $age = null,
        ?string $sort = null,
        ?string $order = null,
    ): array {
        $qb = $this->createQueryBuilder('l')
            ->addSelect('MIN(hs.dateArrivee) AS HIDDEN firstArrival')
            ->join('l.produit', 'p')
            ->leftJoin('l.historiqueStockages', 'hs')
            ->leftJoin('hs.entrepot', 'e')
            ->leftJoin('e.pays', 'pays')
            ->groupBy('l.uuid');

        if ($statut !== null) {
            $qb->andWhere('l.statut = :statut')->setParameter('statut', $statut);
        }
        if ($entrepotUuid !== null) {
            $qb->andWhere('e.uuid = :entrepotUuid')->setParameter('entrepotUuid', $entrepotUuid);
        }
        if ($paysId !== null) {
            $qb->andWhere('pays.id = :paysId')->setParameter('paysId', $paysId);
        }

        if ($search !== null && $search !== '') {
            // Match against any joined storage warehouse/country, not only the current one.
            $qb->andWhere(
                "LOWER(l.libelle) LIKE :search ESCAPE '=' OR LOWER(p.nom) LIKE :search ESCAPE '=' "
                ."OR LOWER(e.nom) LIKE :search ESCAPE '=' OR LOWER(pays.nom) LIKE :search ESCAPE '='"
            )->setParameter('search', '%'.$this->escapeLike(mb_strtolower($search)).'%');
        }

        $this->applyAgeFilter($qb, $age);
        $this->applySort($qb, $sort, $order);

        return QueryPaginator::paginate($qb, $limit, $offset, fetchJoinCollection: true);
    }

    private function applyAgeFilter(QueryBuilder $qb, ?string $age): void
    {
        if ($age === null || !\in_array($age, self::AGE_BUCKETS, true)) {
            return;
        }

        // Start date carries an aggregate (MIN), so bucketing lives in HAVING, not WHERE.
        $start = 'COALESCE(l.constitueeLe, MIN(hs.dateArrivee))';
        $now = new \DateTimeImmutable();

        $threshold = static fn (int $days): \DateTimeImmutable => $now->modify("-{$days} days");

        switch ($age) {
            case self::AGE_LT90:
                $qb->andHaving("{$start} > :ageD90")->setParameter('ageD90', $threshold(90));
                break;
            case self::AGE_90_180:
                $qb->andHaving("{$start} <= :ageD90 AND {$start} > :ageD180")
                    ->setParameter('ageD90', $threshold(90))
                    ->setParameter('ageD180', $threshold(180));
                break;
            case self::AGE_180_365:
                $qb->andHaving("{$start} <= :ageD180 AND {$start} > :ageD365")
                    ->setParameter('ageD180', $threshold(180))
                    ->setParameter('ageD365', $threshold(365));
                break;
            case self::AGE_GT365:
                $qb->andHaving("{$start} <= :ageD365")->setParameter('ageD365', $threshold(365));
                break;
        }
    }

    private function applySort(QueryBuilder $qb, ?string $sort, ?string $order): void
    {
        $direction = mb_strtolower((string) $order) === 'desc' ? 'DESC' : 'ASC';

        if ($sort === null || !\in_array($sort, self::SORT_KEYS, true)) {
            // Default: FIFO, oldest first arrival first.
            $qb->orderBy('firstArrival', 'ASC');

            return;
        }

        switch ($sort) {
            case 'id':
                $qb->orderBy('l.libelle', $direction);
                break;
            case 'status':
                $qb->orderBy('l.statut', $direction);
                break;
            case 'duration':
                // Shorter duration = more recent start date, so duration ASC maps to
                // start date DESC: the ordering is inverted relative to the raw date.
                $startOrder = $direction === 'ASC' ? 'DESC' : 'ASC';
                $qb->addSelect('COALESCE(l.constitueeLe, MIN(hs.dateArrivee)) AS HIDDEN startDate')
                    ->orderBy('startDate', $startOrder);
                break;
            case 'country':
                $this->joinCurrentStorage($qb);
                $qb->addSelect('MIN(cpays.nom) AS HIDDEN currentCountry')
                    ->orderBy('currentCountry', $direction);
                break;
            case 'warehouse':
                $this->joinCurrentStorage($qb);
                $qb->addSelect('MIN(ce.nom) AS HIDDEN currentWarehouse')
                    ->orderBy('currentWarehouse', $direction);
                break;
        }
    }

    /**
     * Join the CURRENT storage row of each lot (aliases cur/ce/cpays) so sorting by
     * country/warehouse reflects the current warehouse, not any historical one.
     *
     * "Current" mirrors LotController::currentStockage: the open storage
     * (dateDepart NULL) with the latest arrival, otherwise the latest arrival
     * overall. Expressed as: no sibling storage of the same lot ranks higher on
     * (open-first, then latest arrival). Exact ties may keep several rows; the
     * MIN() on the ordering column then picks one deterministically.
     */
    private function joinCurrentStorage(QueryBuilder $qb): void
    {
        $openRank = 'CASE WHEN %s.dateDepart IS NULL THEN 1 ELSE 0 END';
        $curRank = sprintf($openRank, 'cur');
        $cmpRank = sprintf($openRank, 'hcmp');

        $qb->leftJoin(
            HistoriqueStockage::class,
            'cur',
            Join::WITH,
            'IDENTITY(cur.lot) = l.uuid AND NOT EXISTS ('
                .'SELECT 1 FROM '.HistoriqueStockage::class.' hcmp '
                .'WHERE IDENTITY(hcmp.lot) = l.uuid AND ('
                    ."({$cmpRank}) > ({$curRank}) "
                    ."OR (({$cmpRank}) = ({$curRank}) AND hcmp.dateArrivee > cur.dateArrivee)"
                .')'
            .')'
        )
            ->leftJoin('cur.entrepot', 'ce')
            ->leftJoin('ce.pays', 'cpays');
    }

    private function escapeLike(string $value): string
    {
        // '=' is the LIKE ESCAPE char declared in the query; escape it first.
        return str_replace(['=', '%', '_'], ['==', '=%', '=_'], $value);
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
