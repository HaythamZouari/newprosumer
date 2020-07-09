<?php

namespace App\Entity;


use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\NinjaRepository")
 */
class Ninja
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

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
    private $tracking;

    /**
     * @ORM\Column(type="string")
     */
    private $raddatabase;

    /**
     * @ORM\Column(type="float")
     */
    private $tilt;

    /**
     * @ORM\Column(type="float")
     */
    private $azimuth;

    /**
     * @ORM\Column(type="float")
     */
    private $capacity;

    /**
     * @ORM\Column(type="float")
     */
    private $loss;

     /**
     * @ORM\Column(type="float")
     */
    private $degradation;

    /**
     * @ORM\Column(type="array")
     */
    private $result = [];

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Project", mappedBy="ninja", cascade={"persist", "remove"})
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

    public function getTracking(): ?int
    {
        return $this->tracking;
    }

    public function setTracking(int $tracking): self
    {
        $this->tracking = $tracking;

        return $this;
    }

    public function getTilt(): ?float
    {
        return $this->tilt;
    }

    public function setTilt(float $tilt): self
    {
        $this->tilt = $tilt;

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

    public function getRaddatabase(): ?string
    {
        return $this->raddatabase;
    }

    public function setRaddatabase(string $raddatabase): self
    {
        $this->raddatabase = $raddatabase;

        return $this;
    }

    public function getCapacity(): ?float
    {
        return $this->capacity;
    }

    public function setCapacity(float $capacity): self
    {
        $this->capacity = $capacity;

        return $this;
    }

    public function getLoss(): ?float
    {
        return $this->loss;
    }

    public function setLoss(float $loss): self
    {
        $this->loss = $loss;

        return $this;
    }

    public function getDegradation(): ?float
    {
        return $this->degradation;
    }

    public function setDegradation(float $degradation): self
    {
        $this->degradation = $degradation;

        return $this;
    }



    public function __toString()
    {
        return (string)$this->id;
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
        $newNinja = $project === null ? null : $this;
        if ($newNinja !== $project->getNinja()) {
            $project->setNinja($newNinja);
        }

        return $this;
    }
}
