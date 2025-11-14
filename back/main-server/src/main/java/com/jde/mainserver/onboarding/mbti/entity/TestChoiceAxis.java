package com.jde.mainserver.onboarding.mbti.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "test_choice_axis")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TestChoiceAxis {

	@EmbeddedId
	private TestChoiceAxisId id;

	@ManyToOne(fetch = FetchType.LAZY)
	@MapsId("choiceId")
	@JoinColumn(name = "choice_id", nullable = false)
	private TestChoice choice;

	public String getAxis() {
		return id == null ? null : id.getAxis();
	}
}


