<?php

namespace App\Tests\Integration\Repository;

use App\Entity\Entrepot;
use App\Entity\HistoriqueStockage;
use App\Entity\Lot;
use App\Entity\Pays;
use App\Entity\Produit;
use App\Repository\LotRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * FIFO ordering of /api/lots must follow each lot's FIRST arrival date (the
 * oldest storage history), even when a lot passed through several warehouses.
 * Ordering on the to-many join column directly would be ambiguous.
 */
class LotFifoOrderTest extends KernelTestCase
{
    public function testLotsAreOrderedByFirstArrival(): void
    {
        self::bootKernel();
        /** @var EntityManagerInterface $em */
        $em = self::getContainer()->get(EntityManagerInterface::class);

        $em->beginTransaction();
        try {
            $pays = (new Pays())->setNom('Fifo')->setCodeIso('ZZ');
            $em->persist($pays);
            $e1 = (new Entrepot())->setNom('E1')->setNumeroRue(1)->setAdresse('a')->setCodePostal(1)->setVille('v')->setPays($pays);
            $e2 = (new Entrepot())->setNom('E2')->setNumeroRue(2)->setAdresse('b')->setCodePostal(2)->setVille('w')->setPays($pays);
            $em->persist($e1);
            $em->persist($e2);
            $produit = (new Produit())->setNom('P')->setDescription('d');
            $em->persist($produit);

            $mk = function (string $libelle) use ($em, $produit): Lot {
                $lot = (new Lot())->setLibelle($libelle)->setQuantite(1)->setProduit($produit)
                    ->setStatut(Lot::STATUT_CONFORME)->setSyncedAt(new \DateTimeImmutable());
                $em->persist($lot);

                return $lot;
            };

            // A : deux entrepôts, première arrivée en janvier (la seconde en février
            // ne doit PAS déterminer l'ordre).
            $a = $mk('A');
            $em->persist((new HistoriqueStockage())->setLot($a)->setEntrepot($e1)->setDateArrivee(new \DateTimeImmutable('2026-01-01')));
            $em->persist((new HistoriqueStockage())->setLot($a)->setEntrepot($e2)->setDateArrivee(new \DateTimeImmutable('2026-02-01')));

            // C : arrivée unique mi-février.
            $c = $mk('C');
            $em->persist((new HistoriqueStockage())->setLot($c)->setEntrepot($e1)->setDateArrivee(new \DateTimeImmutable('2026-02-15')));

            // B : arrivée unique en mars.
            $b = $mk('B');
            $em->persist((new HistoriqueStockage())->setLot($b)->setEntrepot($e1)->setDateArrivee(new \DateTimeImmutable('2026-03-01')));

            $em->flush();

            /** @var LotRepository $repo */
            $repo = self::getContainer()->get(LotRepository::class);

            $all = $repo->findFiltered(null, null, null, 100, 0);
            $this->assertSame(3, $all['total']);
            $this->assertSame(
                ['A', 'C', 'B'],
                array_map(static fn (Lot $l) => $l->getLibelle(), $all['items']),
                'ordre attendu par première arrivée : A (janv.), C (15 févr.), B (mars)'
            );

            // La pagination respecte le même ordre.
            $page1 = $repo->findFiltered(null, null, null, 2, 0);
            $this->assertSame(['A', 'C'], array_map(static fn (Lot $l) => $l->getLibelle(), $page1['items']));
            $this->assertSame(3, $page1['total']);

            $page2 = $repo->findFiltered(null, null, null, 2, 2);
            $this->assertSame(['B'], array_map(static fn (Lot $l) => $l->getLibelle(), $page2['items']));
        } finally {
            $em->rollback();
        }
    }
}
