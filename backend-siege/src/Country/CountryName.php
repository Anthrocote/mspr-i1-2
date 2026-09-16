<?php

namespace App\Country;

/**
 * Country display names are NOT stored: a country is identified by its 2-letter
 * ISO code, and the name is a pure function of that code. The frontend derives
 * its own localized label from the code; this server-side map exists only for
 * backend-facing text (the sync-trigger message) and for lot search by country
 * name (so an operator can still type "Brésil").
 */
final class CountryName
{
    private const NAMES = [
        'br' => 'Brésil',
        'ec' => 'Équateur',
        'co' => 'Colombie',
    ];

    public static function of(string $code): string
    {
        return self::NAMES[strtolower($code)] ?? strtoupper($code);
    }

    /**
     * Country codes whose name (or code) contains the given term, case-insensitive.
     * Lets the lot search match a typed country name without storing that name.
     *
     * @return string[]
     */
    public static function codesMatching(string $term): array
    {
        $needle = mb_strtolower(trim($term));
        if ($needle === '') {
            return [];
        }

        $codes = [];
        foreach (self::NAMES as $code => $name) {
            if (str_contains($code, $needle) || str_contains(mb_strtolower($name), $needle)) {
                $codes[] = $code;
            }
        }

        return $codes;
    }
}
