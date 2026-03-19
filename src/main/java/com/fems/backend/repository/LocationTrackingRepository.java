package com.fems.backend.repository;

import com.fems.backend.entity.LocationTracking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationTrackingRepository extends JpaRepository<LocationTracking, Long> {
}
