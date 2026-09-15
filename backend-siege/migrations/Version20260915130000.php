<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260915130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Statut capteur par entrepôt (dernier_statut, dernier_statut_le)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE entrepot ADD dernier_statut VARCHAR(30) DEFAULT NULL');
        $this->addSql('ALTER TABLE entrepot ADD dernier_statut_le TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE entrepot DROP dernier_statut');
        $this->addSql('ALTER TABLE entrepot DROP dernier_statut_le');
    }
}
