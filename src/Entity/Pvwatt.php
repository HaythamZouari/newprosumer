<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\PvwattRepository")
 */
class Pvwatt
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;
    public function __toString()
    {
        return (string)$this->id;
    }

    /**
     * @ORM\Column(type="float")
     */
    private $lat;

    /**
     * @ORM\Column(type="float")
     */
    private $lon;

    /**
     * @ORM\Column(type="integer")
     */
    private $module_type;

    /**
     * @ORM\Column(type="float")
     */
    private $losses;

    /**
     * @ORM\Column(type="integer")
     */
    private $array_type;

    /**
     * @ORM\Column(type="float")
     */
    private $azimuth;

    /**
     * @ORM\Column(type="float")
     */
    private $tilts;

    /**
     * @ORM\Column(type="array")
     */
    private $result = [];

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Project", mappedBy="pvwatt", cascade={"persist", "remove"})
     */
    private $project;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLat(): ?float
    {
        return $this->lat;
    }

    public function setLat(float $lat): self
    {
        $this->lat = $lat;

        return $this;
    }

    public function getLon(): ?float
    {
        return $this->lon;
    }

    public function setLon(float $lon): self
    {
        $this->lon = $lon;

        return $this;
    }

    public function getModuleType(): ?int
    {
        return $this->module_type;
    }

    public function setModuleType(int $module_type): self
    {
        $this->module_type = $module_type;

        return $this;
    }

    public function getLosses(): ?float
    {
        return $this->losses;
    }

    public function setLosses(float $losses): self
    {
        $this->losses = $losses;

        return $this;
    }

    public function getArrayType(): ?int
    {
        return $this->array_type;
    }

    public function setArrayType(int $array_type): self
    {
        $this->array_type = $array_type;

        return $this;
    }

    public function getAzimuth(): ?float
    {
        return $this->azimuth;
    }

    public function setAzimuth(float $azimuth): self
    {
        $this->azimuth = $azimuth;

        return $this;
    }

    public function getTilts(): ?float
    {
        return $this->tilts;
    }

    public function setTilts(float $tilts): self
    {
        $this->tilts = $tilts;

        return $this;
    }

    public function getResult(): ?array
    {
        return $this->result;
    }

    public function setResult(array $result): self
    {
        $this->result = $result;

        return $this;
    }

    public function getProject(): ?Project
    {
        return $this->project;
    }

    public function setProject(?Project $project): self
    {
        $this->project = $project;

        // set (or unset) the owning side of the relation if necessary
        $newPvwatt = $project === null ? null : $this;
        if ($newPvwatt !== $project->getPvwatt()) {
            $project->setPvwatt($newPvwatt);
        }

        return $this;
    }
}
