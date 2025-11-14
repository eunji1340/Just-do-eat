package com.jde.mainserver.onboarding.bingo.repository;

import com.jde.mainserver.onboarding.bingo.entity.BingoMenuMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BingoMenuMasterRepository extends JpaRepository<BingoMenuMaster, String> {
	List<BingoMenuMaster> findAllByOrderByDisplayOrderAsc();
}


