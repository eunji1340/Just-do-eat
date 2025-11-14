package com.jde.mainserver.onboarding.mbti.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
@EqualsAndHashCode
public class TestChoiceAxisId {

	@Column(name = "choice_id", nullable = false)
	private Long choiceId;

	@Column(name = "axis", nullable = false, length = 16)
	private String axis;

	public TestChoiceAxisId(Long choiceId, String axis) {
		this.choiceId = choiceId;
		this.axis = axis;
	}
}


