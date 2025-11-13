package com.jde.mainserver.region.repository;

import com.jde.mainserver.region.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RegionRepository extends JpaRepository<Region, Long> {

    @Query("select r from Region r order by r.name asc")
    List<Region> findAllOrderByName();
}
