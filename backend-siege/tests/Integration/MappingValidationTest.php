<?php

namespace App\Tests\Integration;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaValidator;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Guards the whole class of bug where a ManyToOne to a UUID-keyed entity omits
 * referencedColumnName and Doctrine falls back to a non-existent "id" column,
 * silently breaking every write path. Runs on metadata only, no database.
 */
class MappingValidationTest extends KernelTestCase
{
    public function testDoctrineMappingIsValid(): void
    {
        self::bootKernel();
        /** @var EntityManagerInterface $em */
        $em = self::getContainer()->get(EntityManagerInterface::class);

        $validator = new SchemaValidator($em);
        $errors = $validator->validateMapping();

        $this->assertSame(
            [],
            $errors,
            "Mapping Doctrine invalide :\n" . print_r($errors, true),
        );
    }
}
