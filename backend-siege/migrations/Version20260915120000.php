<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260915120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout des exploitations (lecture seule au siège) et rattachement des lots';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE exploitation (
                uuid UUID NOT NULL,
                pays_id INT NOT NULL,
                nom VARCHAR(150) NOT NULL,
                PRIMARY KEY(uuid)
            )
        SQL);
        $this->addSql('CREATE INDEX IDX_EXPLOITATION_PAYS ON exploitation (pays_id)');
        $this->addSql('ALTER TABLE exploitation ADD CONSTRAINT FK_exploitation_pays FOREIGN KEY (pays_id) REFERENCES pays (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE lot ADD exploitation_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE lot ADD constituee_le TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_LOT_EXPLOITATION ON lot (exploitation_id)');
        $this->addSql('ALTER TABLE lot ADD CONSTRAINT FK_lot_exploitation FOREIGN KEY (exploitation_id) REFERENCES exploitation (uuid) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE lot DROP CONSTRAINT FK_lot_exploitation');
        $this->addSql('DROP INDEX IDX_LOT_EXPLOITATION');
        $this->addSql('ALTER TABLE lot DROP exploitation_id');
        $this->addSql('ALTER TABLE lot DROP constituee_le');
        $this->addSql('ALTER TABLE exploitation DROP CONSTRAINT FK_exploitation_pays');
        $this->addSql('DROP TABLE exploitation');
    }
}
