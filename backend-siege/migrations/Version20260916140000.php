<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260916140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Le pays est identifié par son seul code ISO : suppression de la colonne nom';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE pays DROP nom');
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE pays ADD nom VARCHAR(50) NOT NULL DEFAULT ''");
    }
}
