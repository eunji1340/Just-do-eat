// restaurants/repository/BookmarkRepository.java
package com.JDE.mainserver.restaurants.repository;

import com.JDE.mainserver.member.entity.Member;
import com.JDE.mainserver.restaurants.entity.Bookmark;
import com.JDE.mainserver.restaurants.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    Optional<Bookmark> findByMemberAndRestaurant(Member member, Restaurant restaurant);
    boolean existsByMemberAndRestaurant(Member member, Restaurant restaurant);
}
