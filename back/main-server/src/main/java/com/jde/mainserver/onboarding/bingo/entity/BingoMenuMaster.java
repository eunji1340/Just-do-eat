package com.jde.mainserver.onboarding.bingo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bingo_menu_master")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BingoMenuMaster {

	@Id
	private String id;

	@Column(nullable = false)
	private String label;

	@Column(name = "display_order", nullable = false)
	private Integer displayOrder;
}


