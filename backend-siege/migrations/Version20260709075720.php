<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260709075720 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Schéma initial : pays, role, produit, entrepot, utilisateur, lot, historique_stockage, mesure, alerte';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE pays (
                id SERIAL NOT NULL,
                nom VARCHAR(50) NOT NULL,
                code_iso VARCHAR(3) NOT NULL,
                api_url VARCHAR(255) DEFAULT NULL,
                api_key VARCHAR(255) DEFAULT NULL,
                last_synced_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
                temp_ideale DOUBLE PRECISION DEFAULT NULL,
                humidite_ideale DOUBLE PRECISION DEFAULT NULL,
                PRIMARY KEY(id)
            )
        SQL);

        $this->addSql(<<<'SQL'
            CREATE TABLE role (
                id SERIAL NOT NULL,
                libelle VARCHAR(100) NOT NULL,
                PRIMARY KEY(id)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ROLE_LIBELLE ON role (libelle)');

        $this->addSql(<<<'SQL'
            CREATE TABLE produit (
                uuid UUID NOT NULL,
                nom VARCHAR(150) NOT NULL,
                description VARCHAR(1000) NOT NULL,
                variete VARCHAR(100) DEFAULT NULL,
                intensite INT DEFAULT NULL,
                amertume INT DEFAULT NULL,
                acidite INT DEFAULT NULL,
                corps INT DEFAULT NULL,
                PRIMARY KEY(uuid)
            )
        SQL);

        $this->addSql(<<<'SQL'
            CREATE TABLE entrepot (
                uuid UUID NOT NULL,
                pays_id INT NOT NULL,
                nom VARCHAR(150) NOT NULL,
                numero_rue INT NOT NULL,
                adresse VARCHAR(200) NOT NULL,
                code_postal INT NOT NULL,
                ville VARCHAR(100) NOT NULL,
                actif BOOLEAN NOT NULL DEFAULT TRUE,
                PRIMARY KEY(uuid)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_ENTREPOT_PAYS ON entrepot (pays_id)');
        $this->addSql('ALTER TABLE entrepot ADD CONSTRAINT FK_entrepot_pays FOREIGN KEY (pays_id) REFERENCES pays (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE utilisateur (
                uuid UUID NOT NULL,
                role_id INT NOT NULL,
                entrepot_id UUID DEFAULT NULL,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                PRIMARY KEY(uuid)
            )
        SQL);
        $this->addSql('CREATE UNIQUE INDEX UNIQ_USER_EMAIL ON utilisateur (email)');
        $this->addSql('CREATE INDEX IDX_USER_ROLE ON utilisateur (role_id)');
        $this->addSql('CREATE INDEX IDX_USER_ENTREPOT ON utilisateur (entrepot_id)');
        $this->addSql('ALTER TABLE utilisateur ADD CONSTRAINT FK_utilisateur_role FOREIGN KEY (role_id) REFERENCES role (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE utilisateur ADD CONSTRAINT FK_utilisateur_entrepot FOREIGN KEY (entrepot_id) REFERENCES entrepot (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE lot (
                uuid UUID NOT NULL,
                produit_id UUID NOT NULL,
                libelle VARCHAR(100) DEFAULT NULL,
                quantite DOUBLE PRECISION NOT NULL,
                statut VARCHAR(20) NOT NULL DEFAULT 'compliant',
                synced_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(uuid)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_LOT_PRODUIT ON lot (produit_id)');
        $this->addSql('ALTER TABLE lot ADD CONSTRAINT FK_lot_produit FOREIGN KEY (produit_id) REFERENCES produit (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE historique_stockage (
                lot_id UUID NOT NULL,
                entrepot_id UUID NOT NULL,
                date_arrivee TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                date_depart TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
                PRIMARY KEY(lot_id, entrepot_id)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_HS_LOT ON historique_stockage (lot_id)');
        $this->addSql('CREATE INDEX IDX_HS_ENTREPOT ON historique_stockage (entrepot_id)');
        $this->addSql('ALTER TABLE historique_stockage ADD CONSTRAINT FK_hs_lot FOREIGN KEY (lot_id) REFERENCES lot (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE historique_stockage ADD CONSTRAINT FK_hs_entrepot FOREIGN KEY (entrepot_id) REFERENCES entrepot (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE mesure (
                uuid UUID NOT NULL,
                entrepot_id UUID NOT NULL,
                temperature DOUBLE PRECISION NOT NULL,
                humidite DOUBLE PRECISION NOT NULL,
                mesure_le TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                synced_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(uuid)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_MESURE_ENTREPOT ON mesure (entrepot_id)');
        $this->addSql('ALTER TABLE mesure ADD CONSTRAINT FK_mesure_entrepot FOREIGN KEY (entrepot_id) REFERENCES entrepot (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql(<<<'SQL'
            CREATE TABLE alerte (
                uuid UUID NOT NULL,
                lot_id UUID DEFAULT NULL,
                entrepot_id UUID DEFAULT NULL,
                type VARCHAR(50) NOT NULL,
                declenchee_le TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                resolue_le TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
                PRIMARY KEY(uuid)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_ALERTE_LOT ON alerte (lot_id)');
        $this->addSql('CREATE INDEX IDX_ALERTE_ENTREPOT ON alerte (entrepot_id)');
        $this->addSql('ALTER TABLE alerte ADD CONSTRAINT FK_alerte_lot FOREIGN KEY (lot_id) REFERENCES lot (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE alerte ADD CONSTRAINT FK_alerte_entrepot FOREIGN KEY (entrepot_id) REFERENCES entrepot (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE alerte DROP CONSTRAINT FK_alerte_lot');
        $this->addSql('ALTER TABLE alerte DROP CONSTRAINT FK_alerte_entrepot');
        $this->addSql('ALTER TABLE historique_stockage DROP CONSTRAINT FK_hs_lot');
        $this->addSql('ALTER TABLE historique_stockage DROP CONSTRAINT FK_hs_entrepot');
        $this->addSql('ALTER TABLE mesure DROP CONSTRAINT FK_mesure_entrepot');
        $this->addSql('ALTER TABLE lot DROP CONSTRAINT FK_lot_produit');
        $this->addSql('ALTER TABLE utilisateur DROP CONSTRAINT FK_utilisateur_role');
        $this->addSql('ALTER TABLE utilisateur DROP CONSTRAINT FK_utilisateur_entrepot');
        $this->addSql('ALTER TABLE entrepot DROP CONSTRAINT FK_entrepot_pays');
        $this->addSql('DROP TABLE alerte');
        $this->addSql('DROP TABLE historique_stockage');
        $this->addSql('DROP TABLE mesure');
        $this->addSql('DROP TABLE lot');
        $this->addSql('DROP TABLE utilisateur');
        $this->addSql('DROP TABLE produit');
        $this->addSql('DROP TABLE entrepot');
        $this->addSql('DROP TABLE role');
        $this->addSql('DROP TABLE pays');
    }
}
